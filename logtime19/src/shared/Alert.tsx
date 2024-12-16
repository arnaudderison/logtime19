import React from "react";

type Props = {
  children: React.ReactNode;
};

function Alert({ children }: Props) {
  return (
    <div className="alert-box">
      <p className="alert">{children}</p>
    </div>
  );
}

export default Alert;