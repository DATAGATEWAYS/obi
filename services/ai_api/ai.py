import re

from fastapi import Depends, APIRouter, Query, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from services.ai_api.deepseek_client import get_deepseek_answer
from services.ai_api.models import *
from services.ai_api.models import QA
from .db import get_session

router = APIRouter()


async def build_context(session: AsyncSession, chat_id: int, limit: int = 6) -> str:
    q = select(QA).where(QA.chat_id == chat_id).order_by(desc(QA.id)).limit(limit)
    rows = list(reversed((await session.execute(q)).scalars().all()))
    if not rows:
        return ""
    lines = []
    for r in rows:
        lines.append(f"User: {r.question}")
        lines.append(f"Assistant: {r.answer}")
    return "Conversation so far:\n" + "\n".join(lines) + "\n"


async def get_or_create_user(session: AsyncSession, telegram_id: int) -> User:
    res = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = res.scalar_one_or_none()
    if user:
        return user
    user = User(telegram_id=telegram_id)
    session.add(user)
    await session.flush()
    return user


async def get_or_create_default_chat(session: AsyncSession, user_id: int) -> Chat:
    res = await session.execute(
        select(Chat).where(Chat.user_id == user_id, Chat.name == "General")
    )
    chat = res.scalar_one_or_none()
    if chat:
        return chat
    chat = Chat(user_id=user_id, name="General")
    session.add(chat)
    await session.flush()
    return chat


@router.post("/chat/create")
async def create_chat(payload: ChatCreatePayload, session: AsyncSession = Depends(get_session)) -> ChatDTO:
    user = await get_or_create_user(session, payload.telegram_id)
    res = await session.execute(
        select(Chat).where(Chat.user_id == user.id, Chat.name == payload.name)
    )
    chat = res.scalar_one_or_none()
    if chat is None:
        chat = Chat(user_id=user.id, name=payload.name)
        session.add(chat)
        await session.flush()
    await session.commit()
    return ChatDTO(id=chat.id, name=chat.name)


@router.get("/chat/list")
async def list_chats(telegram_id: int = Query(...), session: AsyncSession = Depends(get_session)) -> list[ChatDTO]:
    user = await get_or_create_user(session, telegram_id)
    res = await session.execute(select(Chat).where(Chat.user_id == user.id).order_by(Chat.id.asc()))
    items = res.scalars().all()
    return [ChatDTO(id=c.id, name=c.name) for c in items]


@router.post("/ask")
async def ask_endpoint(payload: QuestionPayload, session: AsyncSession = Depends(get_session)):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question is empty")

    user = await get_or_create_user(session, payload.telegram_id)

    chat: Chat | None = None
    if payload.chat_id is not None:
        res = await session.execute(select(Chat).where(Chat.id == payload.chat_id))
        chat = res.scalar_one_or_none()
        if chat is None or chat.user_id != user.id:
            raise HTTPException(status_code=403, detail="Chat not found or does not belong to user")
    else:
        chat = await get_or_create_default_chat(session, user.id)

    context_block = await build_context(session, chat.id, limit=6)
    prompt = (
        "You are Obi, a helpful crypto tutor. "
        "Keep answers brief (≤120 words or 5 bullets). "
        "Continue the same conversation, resolve pronouns from context.\n\n"
        f"{context_block}"
        f"User: {payload.question}\nAssistant:"
    )
    raw_answer = await get_deepseek_answer(prompt)
    answer = from_ai_to_human_readable(raw_answer)

    record = QA(
        user_id=user.id,
        chat_id=chat.id,
        question=payload.question,
        answer=answer,
        created_at=datetime.utcnow(),
    )
    session.add(record)
    await session.commit()

    return {"answer": answer}

@router.get("/chat/history")
async def chat_history(
    telegram_id: int = Query(...),
    chat_id: int = Query(...),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    user = await get_or_create_user(session, telegram_id)
    res = await session.execute(select(Chat).where(Chat.id == chat_id))
    chat = res.scalar_one_or_none()
    if chat is None or chat.user_id != user.id:
        raise HTTPException(status_code=403, detail="Chat not found or does not belong to user")

    q = select(QA).where(QA.chat_id == chat_id).order_by(QA.id.asc()).limit(limit)
    rows = (await session.execute(q)).scalars().all()

    items = []
    for r in rows:
        items.append({"role": "user", "text": r.question})
        items.append({"role": "assistant", "text": markdown_to_telegram_html(r.answer), "html": True})
    return items


def from_ai_to_human_readable(raw: str) -> str:
    return markdown_to_telegram_html(raw)


def markdown_list_to_numbered_and_bullets(text: str) -> str:
    lines = text.splitlines()
    num = 1
    result = []
    for line in lines:
        m = re.match(r'^([ \t]*)-\s+(.*)', line)
        if m:
            spaces = m.group(1)
            content = m.group(2)
            level = (len(spaces) // 2)
            if level == 0:
                prefix = f"{num}. "
                num += 1
            else:
                n_spaces = 2 ** level + (level if level > 1 else 0)
                prefix = ' ' * n_spaces + '• '
            result.append(prefix + content)
        else:
            result.append(line)
            num = 1
    return '\n'.join(result)


def markdown_table_to_text(md_table: str) -> str:
    lines = [line.strip() for line in md_table.strip().split('\n') if line.strip()]
    headers = [h.strip(' *') for h in lines[0].strip('|').split('|')]
    result = []
    for row in lines[2:]:
        cols = [c.strip() for c in row.strip('|').split('|')]
        section = f'<b>{cols[0]}</b>\n'
        for h, c in zip(headers[1:], cols[1:]):
            section += f'    <b>{h}:</b> {c}\n'
        result.append(section)
    return '\n'.join(result)


def process_markdown_tables(text: str) -> str:
    table_pattern = re.compile(
        r'((?:^\|.*\|\s*\n)+^\|[\s\-:|]+\|\s*\n(?:^\|.*\|\s*\n?)+)', re.MULTILINE)

    def replace_table(match):
        md_table = match.group(1)
        return '\n' + markdown_table_to_text(md_table) + '\n'

    return table_pattern.sub(replace_table, text)


def add_blank_lines_to_lists(text: str) -> str:
    text = re.sub(r'^(\d+\..+)', r'\1\n', text, flags=re.MULTILINE)
    text = re.sub(r'^([•*]\s.+)', r'\1\n', text, flags=re.MULTILINE)
    return text


def markdown_to_telegram_html(text: str) -> str:
    # Add a blank line after each list item (numbered or * or •)
    text = add_blank_lines_to_lists(text)
    # 0. Preprocess markdown tables (replace them with readable text)
    text = process_markdown_tables(text)
    # 1. Lists
    text = markdown_list_to_numbered_and_bullets(text)
    # 2. Replace asterisks at start of lines with bullets for lists
    text = re.sub(r'^[ \t]*\*\s+', '• ', text, flags=re.MULTILINE)
    # 3. Multiline code blocks with language
    text = re.sub(
        r'```(\w+)\n(.*?)```',
        r'<pre><code class="language-\1">\2</code></pre>',
        text,
        flags=re.DOTALL
    )
    # 4. Bold+Italic (***text***)
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<b><i>\1</i></b>', text)
    # 5. Bold (**text**)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # 6. Italic (*text*)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    # 7. Strikethrough
    text = re.sub(r'~~(.+?)~~', r'<s>\1</s>', text)
    # 8. Underline
    text = re.sub(r'__(.+?)__', r'<u>\1</u>', text)
    # 9. Links
    text = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', text)
    # 10. Headers
    text = re.sub(r'^### (.+)$', r'<b>\1</b>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.+)$', r'<b>\1</b>', text, flags=re.MULTILINE)
    text = re.sub(r'^# (.+)$', r'<b>\1</b>', text, flags=re.MULTILINE)
    # 11. Inline code
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return text
