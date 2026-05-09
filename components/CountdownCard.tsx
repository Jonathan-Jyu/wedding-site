type CountdownCardProps = {
  label: string;
  value: number;
};

export default function CountdownCard({ label, value }: CountdownCardProps) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  );
}
