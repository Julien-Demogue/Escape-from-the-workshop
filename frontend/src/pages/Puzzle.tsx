import React from "react";
import { Link } from "react-router-dom";
import Jigsaw from "../components/Jigsaw";
import ThickBorderCloseButton from "../components/ui/ThickBorderCloseButton";

const Puzzle: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <ThickBorderCloseButton />
      <div>
        <Jigsaw
          imageUrl="https://www.chateauvillandry.fr/wp-content/uploads/2022/01/chateauvillandry-vue-generale-2-credit-photo-f.paillet-scaled.jpg"
          width={640}
          onSolved={() => console.log("Puzzle solved")}
        />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/" style={{ textDecoration: "underline", color: "#2563eb" }}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Puzzle;
