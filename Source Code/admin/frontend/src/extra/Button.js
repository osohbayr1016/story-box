"use client";

export default function Button(props) {
  const {
    newClass,
    btnColor,
    btnName,
    onClick,
    style,
    btnIcon,
    disabled,
    type,
  } = props;

  const resolvedType = type || "button";

  return (
    <>
      <button
        className={`themeBtn text-center ${newClass || ""} ${btnColor || ""}`}
        onClick={onClick}
        style={style}
        disabled={disabled}
        type={resolvedType}
      >
        {btnIcon ? (
          <>
            {btnIcon}
            {btnName}
          </>
        ) : (
          btnName
        )}
      </button>
    </>
  );
}
