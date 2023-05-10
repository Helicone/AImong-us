export function TinyLabel(props: { text: string }) {
  const { text } = props;
  return <div className="text-xs text-slate-300 select-none">{text}</div>;
}
