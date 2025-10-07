import React from "react";
import { Link } from "react-router-dom";
import ThickBorderButton from "../components/ui/ThickBorderButton";

const Group: React.FC = () => {
  return (
    <div className="relative w-full h-screen">
      <div className="flex items-center justify-center h-full">
        <h1>Group</h1>
      </div>
      <div className="absolute bottom-8 left-8">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <ThickBorderButton>
            Retour
          </ThickBorderButton>
        </Link>
      </div>
    </div>
  );
};

export default Group;
