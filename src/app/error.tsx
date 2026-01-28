"use client";

import React from "react";

type Props = {};

export default function error({}: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold">An error occurred</h1>
      <p className="mt-4">
        Please try again later or contact support if the issue persists.
      </p>

    </div>
  );
}
