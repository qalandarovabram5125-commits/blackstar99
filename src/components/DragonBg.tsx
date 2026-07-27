import dragonAsset from "@/assets/dragon.png.asset.json";

export function DragonBg() {
  return (
    <>
      <div className="dragon-layer dragon-layer--back" aria-hidden>
        <img src={dragonAsset.url} alt="" className="dragon dragon--back" />
      </div>
      <div className="dragon-layer dragon-layer--front" aria-hidden>
        <img src={dragonAsset.url} alt="" className="dragon dragon--front" />
      </div>
    </>
  );
}