import re

msg = """Okay, here's a comparison between Ethereum (ETH) and Bitcoin (BTC), two of the most important and dominant cryptocurrencies:

| **Criteria** | **Bitcoin (BTC)** | **Ethereum (ETH)** |
|-------------|------------------|-------------------|
| **Origins & Core Purpose** | Created 2009 by Satoshi Nakamoto; focused on being a peer-to-peer electronic cash system and store of value; sometimes called "digital gold"; primarily a payment network | Created 2015 by Vitalik Buterin et al.; aimed to create a smart contract platform beyond just currency; enables DApps, DeFi, and programmable money |
| **Supply Cap** | Fixed at **21 million** BTC (though currently still far below that target) | Expansionary: new ETH is created with each block through staking rewards |
| **Primary Use Case** | Store of value and decentralized digital cash | Smart contract platform powering decentralized applications and finance |
| **Technology** | Based on UTXO model with Schnorr signatures; p2pkh and p2wpkh-p2wsh address types; segwit support | Based on account model with EVM; contract accounts vs. externally-owned accounts; EIP-1559 fee mechanism |
| **Smart Contract Capability** | Limited or virtually none | Core functionality; enables DeFi, DAOs, NFTs, token creation, etc. |
| **Consensus** | Proof-of-Work (PoW) | Transitioned to Proof-of-Stake (PoS); EIP-1559 has moved part of fee issuance to network security |
| **Network Features** | Simplified blockchain structure; primarily a payment network | More complex blockchain; supports many thousands of decentralized applications |

**Summary of Key Differences:**

1.  **Purpose:** BTC is often seen as a decentralized digital store of value ("peer-to-peer electronic cash" or "digital gold"). ETH is a decentralized platform for running smart contracts (applications that execute automatically when conditions are met), powering decentralized finance (DeFi), NFTs, DAOs, and more.
2.  **Supply:** BTC has a fixed, capped supply of 21 million coins. ETH does not have a hard cap, though issuance is controlled by economic mechanisms like staking rewards (though the model is complex). The BTC supply increase rate halves every ~4 years until the cap is approached, while eth issuance is more dynamic and can even contract if staking rewards exceed issuance from new economic activity.
3.  **Smart Contracts:** ETH's core innovation is the ability to run smart contracts on its network, enabling a vast ecosystem beyond simple payments. BTC does not support smart contracts in its current form.
4.  **Technology:** BTC is simpler but extremely robust. ETH is more complex, incorporating features like an "Ethereum Virtual Machine" (EVM) and various improvements (like EIP-1559) driven by an active developers' community.
5.  **Consensus:** Both are transitioning/mined using Proof-of-Work (PoW). However, BTC remains predominantly PoW long-term, while ETH fully transitioned to Proof-of-Stake (PoS) in September 2022, fundamentally changing its security mechanism and energy profile.
6.  **Network & Features:** The BTC blockchain is focused on transaction history primarily for value transfers. The ETH blockchain is much larger and contains all the data and state necessary to run its diverse applications.

**Potential Pitfalls:**

*   **BTC:** Criticized by some as not being truly "programmable" (smart contracts), being slow, and expensive compared to newer competitors. It is almost universally seen as more inflation-resistant due to the supply cap.
*   **ETH:** Criticized by some for initially being inflationary (though now more stable under its current economic model), high gas fees during periods of high demand, and being a more complex network. ETH 2.0 (Serenity) aims to address scalability, security, and sustainability (via sharding) and was partially deployed in 2022/23.

Which one is "better" depends on what you are looking for. Many investors hold both as part of a diversified crypto portfolio, seeing them as distinct asset classes.
"""




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

print(markdown_to_telegram_html(msg))