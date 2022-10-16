import React from "react";

// ts-prune-ignore-next
export function Debug(
  props: { d: any } & React.DetailedHTMLProps<
    React.DetailsHTMLAttributes<HTMLDetailsElement>,
    HTMLDetailsElement
  >
) {
  const { d, ...rest } = props;
  return (
    <details {...rest}>
      <summary onClick={() => console.log("debug", d)}>debug</summary>
      <pre>{JSON.stringify(d, null, 2)}</pre>
    </details>
  );
}
