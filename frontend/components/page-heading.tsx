export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h1 className="display-title mt-2 text-4xl leading-tight md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-body">{description}</p>
    </header>
  );
}
