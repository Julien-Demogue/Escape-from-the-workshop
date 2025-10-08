import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";

export type JigsawHandle = {
  solveNow: () => void;
  reshuffle: () => void;
};

type JigsawProps = {
  imageUrl: string;
  width?: number;        // px, default 640
  innerGap?: number;     // px between tiles (small), default 3
  outerPadding?: number; // px around the outside frame, default equals innerGap
  radius?: number;       // outer rounded corners, default 20
  onSolved?: () => void;
  onShuffle?: () => void; // callback when user clicks Shuffle
  className?: string;
};

const ROWS = 5; // 5 x 6 = 30
const COLS = 6;

type Piece = { id: number; currentIndex: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Jigsaw = forwardRef<JigsawHandle, JigsawProps>(function Jigsaw(
  {
    imageUrl,
    width = 640,
    innerGap = 3,
    outerPadding,
    radius = 20,
    onSolved,
    onShuffle,
    className = "",
  },
  ref
) {
  const pieceCount = ROWS * COLS;

  // start already shuffled
  const [pieces, setPieces] = useState<Piece[]>(() => {
    const ids = shuffle(Array.from({ length: pieceCount }, (_, i) => i));
    return ids.map((id, i) => ({ id, currentIndex: i }));
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  const height = useMemo(() => Math.round((width * ROWS) / COLS), [width]);

  function doReshuffle() {
    const ids = shuffle(Array.from({ length: pieceCount }, (_, i) => i));
    setPieces(ids.map((id, i) => ({ id, currentIndex: i })));
    setSelected(null);
    setIsSolved(false);
    onShuffle?.();
  }

  function doSolveNow() {
    // set each piece into its correct position
    const ids = Array.from({ length: pieceCount }, (_, i) => i);
    setPieces(ids.map((id) => ({ id, currentIndex: id })));
    setSelected(null);
    // onSolved will be triggered by the effect below
  }

  // expose API
  useImperativeHandle(ref, () => ({
    solveNow: doSolveNow,
    reshuffle: doReshuffle,
  }));

  function swapByBoardIndex(aIdx: number, bIdx: number) {
    setPieces((prev) => {
      const next = [...prev];
      const iA = next.findIndex((p) => p.currentIndex === aIdx);
      const iB = next.findIndex((p) => p.currentIndex === bIdx);
      if (iA === -1 || iB === -1) return prev;
      const A = next[iA], B = next[iB];
      next[iA] = { ...A, currentIndex: B.currentIndex };
      next[iB] = { ...B, currentIndex: A.currentIndex };
      return next;
    });
  }

  useEffect(() => {
    const ok = pieces.every((p) => p.id === p.currentIndex);
    setIsSolved(ok);
    if (ok && onSolved) onSolved();
  }, [pieces, onSolved]);

  function idxToRC(idx: number) {
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
    return { r, c };
  }

  function bgPosForId(id: number) {
    const { r, c } = idxToRC(id);
    const x = (c / (COLS - 1)) * 100;
    const y = (r / (ROWS - 1)) * 100;
    return `${x}% ${y}%`;
  }

  function onTileClick(boardIdx: number) {
    if (selected === null) setSelected(boardIdx);
    else if (selected === boardIdx) setSelected(null);
    else {
      swapByBoardIndex(selected, boardIdx);
      setSelected(null);
    }
  }

  function onDragStart(e: React.DragEvent<HTMLDivElement>, boardIdx: number) {
    e.dataTransfer.setData("text/plain", String(boardIdx));
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>, targetIdx: number) {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(from)) swapByBoardIndex(from, targetIdx);
  }

  const cells = Array.from({ length: pieceCount }, (_, boardIdx) => {
    const piece = pieces.find((p) => p.currentIndex === boardIdx)!;
    const highlight =
      selected === boardIdx ? { boxShadow: "inset 0 0 0 2px #3b82f6" } : undefined;

    return (
      <div
        key={boardIdx}
        role="button"
        tabIndex={0}
        aria-label={`Tile ${boardIdx + 1}`}
        style={{
          // IMPORTANT: no borderRadius here, so only outer corners are rounded
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
          backgroundPosition: bgPosForId(piece.id),
          backgroundRepeat: "no-repeat",
          userSelect: "none",
          cursor: "pointer",
          ...highlight,
        }}
        onClick={() => onTileClick(boardIdx)}
        draggable
        onDragStart={(e) => onDragStart(e, boardIdx)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, boardIdx)}
      />
    );
  });

  const pad = outerPadding ?? innerGap; // keep outside spacing subtle and consistent

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 14, opacity: 0.8 }}>
          Drag or tap two tiles to swap
        </span>
        <button
          onClick={doReshuffle}
          style={{
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Shuffle
        </button>
      </div>

      {/* Outer frame: rounded corners only here */}
      <div
        style={{
          width,
          height,
          padding: pad,
          background: "#fff",
          borderRadius: radius,
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: innerGap,
          }}
        >
          {cells}
        </div>
      </div>

      <div style={{ marginTop: 12, minHeight: 24 }}>
        {isSolved && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "#dcfce7",
              color: "#166534",
              fontSize: 12,
            }}
          >
            Solved! 🎉
          </span>
        )}
      </div>
    </div>
  );
});

export default Jigsaw;
export { ROWS, COLS };
