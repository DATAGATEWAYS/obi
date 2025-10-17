"use client";

export default function MintPopup({
  tokenId,
  onClose,
  onView,
}: { tokenId: number; onClose: () => void; onView?: () => void }) {
  const img = `/assets/nfts/${tokenId}.png`;
  return (
    <>
      <style>{`
        .mint-backdrop{position:fixed; inset:0; background:rgba(0,0,0,.45);
          display:flex; align-items:center; justify-content:center; z-index:1000;}
        .mint-card{width:min(90vw,360px); background:#fff; border-radius:16px; padding:16px;
          box-shadow:0 10px 30px rgba(0,0,0,.25); text-align:center; color:#6C584C;}
        .mint-card img{width:160px; height:160px; object-fit:contain;}
        .mint-actions{display:flex; gap:10px; margin-top:12px;}
        .mint-actions button{flex:1; padding:12px 14px; border-radius:10px; border:none; cursor:pointer; font-weight:700;}
      `}</style>
      <div className="mint-backdrop" onClick={onClose}>
        <div className="mint-card" onClick={(e) => e.stopPropagation()}>
          <h3 style={{marginTop:0}}>You’ve got a new badge!</h3>
          <img src={img} alt={`Badge #${tokenId}`} />
          <div className="mint-actions">
            <button style={{background:"#f0f0f0"}} onClick={onClose}>Close</button>
            {onView && <button style={{background:"#2f6b33", color:"#fff"}} onClick={onView}>View</button>}
          </div>
        </div>
      </div>
    </>
  );
}