// Types for the generated migrations.js, which bundles the .sql files through babel-plugin-inline-import.
declare const migrations: {
  journal: { entries: { idx: number; when: number; tag: string; breakpoints: boolean }[] };
  migrations: Record<string, string>;
};
export default migrations;
