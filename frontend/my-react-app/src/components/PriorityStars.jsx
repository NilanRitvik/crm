export default function PriorityStars({ value = 1, onChange, readOnly }) {
  return (
    <div style={{ fontSize: "16px" }}>
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange && onChange(star)}
          style={{
            cursor: readOnly ? "default" : "pointer",
            color: star <= value ? "gold" : "#ccc",
            marginRight: "2px"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
