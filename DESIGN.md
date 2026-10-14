---
name: 中大穿梭校巴
description: A campus bus planner set with the finish of Safari, Chrome, and Edge.
colors:
  browser-blue: "#0b57d0"
  on-blue: "#ffffff"
  grouped-gray: "#f5f5f7"
  surface: "#ffffff"
  ink: "#1c1c1e"
  secondary-ink: "#5f6368"
  hairline: "#dadce0"
  selected-tint: "#e8f0fe"
  well: "#f1f3f4"
  segment-track: "#e4e6ea"
  error: "#b3261e"
  error-surface: "#fce8e6"
  error-ink: "#a50e0e"
  warning-surface: "#fef7e0"
  warning-ink: "#7a4f01"
  warning-line: "#f3d48a"
  selection: "#d3e3fd"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.125
    letterSpacing: "normal"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, PingFang SC, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  control: "8px"
  panel: "12px"
  mark: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.browser-blue}"
    textColor: "{colors.on-blue}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
    typography: "{typography.label}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
    typography: "{typography.label}"
  button-segment-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
    typography: "{typography.label}"
  input-place:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  chip-selected:
    backgroundColor: "{colors.selected-tint}"
    textColor: "{colors.browser-blue}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
    typography: "{typography.label}"
---

# Design System: 中大穿梭校巴

## Overview

**Creative North Star: "A browser settings page"**

The page is a working tool, finished the way Safari, Chrome, and Edge finish their own settings. A student outdoors, in daylight, picks a start and an end and reads which bus to take. The ground is a cool gray, the panels are white, and one blue does selection, focus, and links. Route colors stay on the route mark only, because they are data.

The old warm paper ground, serif titles, and wine accent are the anti-reference. Nothing else is added on top of those three browsers.

**Key Characteristics:**

- Cool gray page, white panels, one blue
- One system sans, sized by role
- Hairline borders, not shadows, except the selected segment
- The answer is a short settings list led by a rounded-square route mark

## Colors

The palette is the shared light UI of those browsers: neutral chrome, and blue only where the interface is pointing.

### Primary

- **Browser Blue** (`{colors.browser-blue}`): The selected chip text, text links, the caret, and the focus outline. White text sits on it when a control is filled.

### Neutral

- **Grouped Gray** (`{colors.grouped-gray}`): The page ground. Daylight, not paper.
- **Surface** (`{colors.surface}`): Panels, the place field, outline buttons, and the selected segment.
- **Ink** (`{colors.ink}`): Titles, stop names, and primary labels.
- **Secondary Ink** (`{colors.secondary-ink}`): Descriptions, empty values, and unselected segment labels.
- **Hairline** (`{colors.hairline}`): Panel borders and list rules.
- **Well** (`{colors.well}`): Quiet fills behind secondary groups.
- **Segment Track** (`{colors.segment-track}`): The track behind 设置起点 / 设置终点.
- **Selected Tint** (`{colors.selected-tint}`): The fill of a chosen place chip.

### Named Rules

**The One Blue Rule.** Browser Blue is the only chrome color. Route colors never become the page accent.

**The State Color Rule.** Errors use Error Surface with Error Ink. Close-stop warnings use Warning Surface with Warning Ink. Those colors mean a state, not a theme.

## Typography

**Display Font:** The system sans (system-ui, then Segoe UI, PingFang SC, Noto Sans SC, Microsoft YaHei)
**Body Font:** The same stack
**Label/Mono Font:** The same stack. Times and route numbers use tabular figures.

**Character:** One face. Weight and size do the hierarchy, the way a browser settings page does. Chinese falls through to PingFang, Noto Sans SC, or Microsoft YaHei.

### Hierarchy

- **Headline** (600, 28px on a phone and 32px on a desktop, line-height 1.125): The product name only.
- **Title** (600, 20px, 24px from the small breakpoint): The recommendation, such as 建议乘 N 号线.
- **Body** (400, 16px, line-height 1.5, measure about 65ch): The intro and the answer's supporting sentence.
- **Label** (500, 14px): Buttons, chips, and section labels such as 常用地点.

### Named Rules

**The One Face Rule.** Do not introduce a serif, a display face, or a second sans for headings.

## Layout

The page is a single column up to 72rem, with 16px of side padding. On a wide screen the map is the left work area and the controls are the right, in a 1.15 / 0.85 split with 24px between them. The map sticks under a 16px offset and is short enough that the campus and the map credit fit in the first screen.

On a phone the map is 240px, then the key line, then the controls. The recommendation stays under the place chips, because the empty state tells the reader the places are above it.

Space above 收录的路线 is a 40px pad under a hairline. Space under that heading, before its sentence, is 8px.

## Elevation & Depth

Panels are flat. Depth is a 1px hairline and a change of ground, from Grouped Gray to Surface. The only shadow is the selected segment, a 1px offset with a 2px blur.

### Shadow Vocabulary

- **Segment** (`box-shadow: 0 1px 2px rgba(28, 28, 30, 0.18)`): The white half of 设置起点 / 设置终点, and nowhere else.

### Named Rules

**The Flat Panel Rule.** Cards, route rows, and the map frame do not float. A shadow on a panel is a mistake.

## Shapes

Controls, fields, and chips use an 8px corner. Panels use a 12px corner. The route mark is a 6px rounded square, the size of a site icon, not a pill.

Focus is a 2px Browser Blue outline, offset 2px. Selection highlight is Selection (`{colors.selection}`). The caret is Browser Blue.

## Components

### Buttons

- **Shape:** 8px corners, 44px tall, 14px horizontal padding, 500 weight.
- **Primary:** Browser Blue fill, white label. Used when a single action must be filled. Hover stays on the same blue.
- **Outline:** White fill, Hairline stroke, Ink label. 定位, 使用当前位置, and the map links.
- **Segment:** Two ghost buttons in a Segment Track. The active one is Surface, 600 weight, with the segment shadow. The other is Secondary Ink at 500.
- **Hover / Focus:** Color and border move over 150ms with cubic-bezier(0.2, 0, 0, 1). Focus is the offset blue outline. Nothing jumps on press.

### Chips

- **Style:** Outline buttons. Unselected is Surface with a Hairline. Selected is Selected Tint with Browser Blue text and a blue-tinted stroke.
- **State:** `aria-pressed` follows the place currently chosen for the active end.

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** Surface.
- **Shadow Strategy:** None.
- **Border:** 1px Hairline.
- **Internal Padding:** 16px.

The answer inside the card is a list: a route mark and the line name, then 上车 and 下车 as label-over-value rows separated by hairlines. Walk links sit under a hairline, not inside a second filled card.

### Inputs / Fields

- **Style:** The place field is Surface, Hairline stroke, 8px corners, 16px type, 44px tall.
- **Focus:** The stroke and a 2px offset outline both become Browser Blue.
- **Error / Disabled:** A missed lookup or a refused location is Error Ink on Error Surface. The field itself is unchanged. Disabled controls fade to half opacity.

### Route mark

- **Shape:** 32px rounded square, 6px corners, tabular figures.
- **Color:** The route's own color, with ink chosen so the number stays readable. That color is not reused anywhere else.

## Do's and Don'ts

### Do:

- **Do** keep the page on Grouped Gray and the panels on Surface.
- **Do** use Browser Blue for the selected chip, the link, the caret, and the focus outline.
- **Do** lead a recommendation with the rounded-square route mark and the stop names as a list.
- **Do** keep controls at 44px. The page is used outdoors, on a phone.

### Don't:

- **Don't** bring back the warm paper ground, the serif title, or the wine accent.
- **Don't** paint the page with a route color.
- **Don't** put a legend over the map credit.
- **Don't** add a second typeface, a gradient ground, or a floating card shadow.
