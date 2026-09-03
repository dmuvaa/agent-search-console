import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#07966A",
          borderRadius: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="126" height="126" viewBox="0 0 64 64" fill="none">
          <path
            d="M24 17h12a11 11 0 0 1 8.6 17.85L51 41.25 46.25 46l-6.4-6.4A11 11 0 0 1 24 30.98V17Z"
            fill="#FFFFFF"
          />
          <path d="M29.5 22.5h6.25a5.25 5.25 0 1 1 0 10.5H29.5V22.5Z" fill="#07966A" />
          <path d="M20 21h-5v5h5v-5ZM20 39h-5v5h5v-5ZM34 48h-5v5h5v-5Z" fill="#DDF8EC" />
          <path
            d="M20 23.5h4M17.5 26v13M20 41.5h9M31.5 44v4"
            stroke="#DDF8EC"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
