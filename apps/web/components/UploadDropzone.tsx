"use client";

export function UploadDropzone({ onFile }: { onFile: (name: string, content: string) => void }) {
  return (
    <label className="block cursor-pointer rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-4 text-center text-sm text-zinc-300 hover:border-cyan-400">
      Upload file
      <input
        className="hidden"
        type="file"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file.name, await file.text());
        }}
      />
    </label>
  );
}
