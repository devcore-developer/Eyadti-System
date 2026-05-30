1. Color System
The color system is manually crafted for both Light and Dark modes to ensure premium contrast and readability (no simple color inversion).

Light Mode
Background: #F8FAFC (Warm slate white)
Surface/Cards: #FFFFFF
Sidebar: #FFFFFF
Primary: #0EA5A4 (Teal)
Accent: #2563EB (Royal Blue)
Success: #22C55E
Warning: #F59E0B
Danger: #EF4444
Text Primary: #0F172A
Text Secondary: #64748B
Borders: #E5E7EB
Dark Mode
Background: #0F172A (Deep Slate)
Sidebar: #111827
Cards: #1E293B
Brand/Primary: #2DD4BF (Lighter Teal for dark backgrounds)
Text Primary: #F8FAFC
Text Secondary: #CBD5E1
Borders: #334155
2. Typography
Consistent typography scale using Inter.

Page Titles: 32px / 700 (Class: text-page-title)
Section Titles: 20px / 600 (Class: text-section-title)
Card Titles: 16px / 600 (Class: text-card-title)
Body: 14px / 400 (Class: text-body)
Small/Caption: 12px / 400 (Class: text-small)
3. Spacing & Radius
Premium Spacing
Large whitespace is crucial for a premium feel. Avoid crowded layouts.

Page padding: p-6 md:p-8 lg:p-10
Section gaps: space-y-8 or mb-8
Inner card padding: p-6 md:p-8
Radius System
Cards: 16px (CSS Var: --radius-card)
Inputs: 12px (CSS Var: --radius-input)
Buttons: 12px (CSS Var: --radius-button)
Dialogs: 20px (CSS Var: --radius-dialog)
4. Shadows & Elevation
Shadows are intentionally subtle (Vercel/Linear style).

Default Card: 0px 1px 3px rgba(0,0,0,0.04), 0px 4px 12px rgba(0,0,0,0.02)
Hover State: 0px 4px 12px rgba(0,0,0,0.06), 0px 8px 24px rgba(0,0,0,0.04)
Use the .glass-card utility class to apply this automatically.

5. Motion & Animations
Motion should be fast and purposeful. Duration: 150ms – 250ms.

fade: Use for simple visibility toggles. (Class: animate-fade)
slide-up: Use for page content entrance. (Class: animate-slide-up)
scale-in: Use for modals, popovers, and KPI cards. (Class: animate-scale-in)
6. Component Architecture
Layout Components
AppShell: Wraps Sidebar and Main Content.
PageHeader: Contains text-page-title and page-level actions.
SectionCard: The primary container for grouping content (uses .glass-card).
FormSection: Grid wrapper for form inputs with titles.
Data Display
KPICard: For dashboard metrics (Icon, Title, Value, Change).
StatsCard: Simpler metric card (Title, Value, small icon).
StatusBadge: For appointment/payment states (Uses semantic colors).
TableContainer: Wraps <table> elements providing radius and overflow scroll.
Inputs & Actions
SearchBar: Standardized search input with icon.
Button: Updated with 12px radius and smooth hover/active transitions (active:scale-[0.98]).
