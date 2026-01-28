import React from "react";

type Props = {};

export default function loading({}: Props) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-lg">Loading...</p>
    </div>
  );
}
