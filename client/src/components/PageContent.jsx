function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderBlock(block, index) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('## ')) {
    return (
      <h2 key={index} className="mt-8 text-xl font-bold text-slate-900 dark:text-white">
        {trimmed.slice(3)}
      </h2>
    );
  }

  if (trimmed.startsWith('### ')) {
    return (
      <h3 key={index} className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">
        {trimmed.slice(4)}
      </h3>
    );
  }

  const lines = trimmed.split('\n');
  if (lines.every((line) => line.startsWith('- '))) {
    return (
      <ul key={index} className="mt-3 list-disc space-y-2 pl-5 text-slate-600 dark:text-slate-300">
        {lines.map((line, i) => (
          <li key={i}>{renderInline(line.slice(2))}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={index} className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
      {renderInline(trimmed)}
    </p>
  );
}

export default function PageContent({ content = '' }) {
  const blocks = content.split(/\n\n+/);
  return <div className="max-w-3xl">{blocks.map(renderBlock)}</div>;
}
