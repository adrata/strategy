declare module "simplebar-react" {
  import { ComponentType, HTMLAttributes } from "react";

  interface SimpleBarProps extends HTMLAttributes<HTMLDivElement> {
    scrollableNodeProps?: HTMLAttributes<HTMLDivElement>;
    autoHide?: boolean;
    forceVisible?: "x" | "y" | boolean;
    options?: {
      clickOnTrack?: boolean;
      scrollbarMinSize?: number;
      scrollbarMaxSize?: number;
      classNames?: {
        content?: string;
        scrollContent?: string;
        scrollbar?: string;
        track?: string;
        autoHide?: string;
        visible?: string;
        horizontal?: string;
        vertical?: string;
        corner?: string;
        dragging?: string;
        scrollable?: string;
        mouseEntered?: string;
      };
    };
  }

  const SimpleBar: ComponentType<SimpleBarProps>;
  export default SimpleBar;
}
