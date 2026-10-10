import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

// The prompt wants maximum 64px gap between sections.
// Right now sections have `py-20 md:py-28`.
// Let's use `py-14` (56px) for the first section, but if we have consecutive sections, `py-14` + `py-14` = 112px, because padding doesn't collapse.
// Let's change sections to have `margin-top: 56px; margin-bottom: 56px;` by replacing `className="py-20 md:py-28 mx-auto w-full"` with `className="my-14 mx-auto w-full"`
content = content.replace(/className="py-20 md:py-28 mx-auto w-full"/g, 'className="my-14 mx-auto w-full"');

// And for the call to action, which has a background `bg-gradient-to-b`, we should use padding: `py-14`
content = content.replace(/className="relative overflow-hidden w-full py-28 md:py-36 mx-auto/g, 'className="relative overflow-hidden w-full py-14 mx-auto');

// Section Titles: 8px below label
content = content.replace(/mb-4"/g, 'mb-2"'); // Let's precise this
content = content.replace(/uppercase mb-4"/g, 'uppercase mb-2"');

// 20px - 24px below headings
content = content.replace(/mb-12"/g, 'mb-6"');
content = content.replace(/mb-16"/g, 'mb-6"');
content = content.replace(/mt-12/g, 'mt-0'); // because mb-6 on heading provides 24px

// Community impact:
// Stats directly below heading
// className="mb-6 text-center" is correct (24px)
// It was inside container
// After stats, 56px before next section... well we added `my-14` so it's handled.

// Platform features:
// Reduce height of cards: "flex flex-col gap-4 p-8 rounded-[32px]"
content = content.replace(/flex flex-col gap-4 p-8 rounded-\[32px\]/g, 'flex flex-col gap-3 p-6 rounded-[24px]');

// Our Mission:
// Image and text align natively
// Replace grid gap: gap-12 lg:gap-16 -> gap-8 lg:gap-12
content = content.replace(/gap-12 lg:gap-16/g, 'gap-8 lg:gap-12');

// Navbar Offset
// First section pt-20 pb-20 min-h-[90vh]
content = content.replace(/min-h-\[90vh\] flex items-center w-full pt-20 pb-20/g, 'min-h-[85vh] flex items-center w-full pt-[100px] pb-14');

fs.writeFileSync('src/pages/LandingPage.tsx', content);

let footerContent = fs.readFileSync('src/components/layout/Footer.tsx', 'utf-8');
// remove massive empty area above footer. 
// Right now footer has pt-4 pb-6. We can reduce it if needed, but it's already small.
fs.writeFileSync('src/components/layout/Footer.tsx', footerContent);

console.log("Done");
