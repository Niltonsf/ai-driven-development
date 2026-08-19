// Primitives
export { Alert, type AlertProps } from "./alert.component";
export { Avatar, type AvatarProps } from "./avatar.component";
export { Badge, type BadgeProps } from "./badge.component";
export { Button, type ButtonProps } from "./button.component";
export { Checkbox, type CheckboxProps } from "./checkbox.component";
export { Divider, type DividerProps } from "./divider.component";
export { FormField, type FormFieldProps } from "./form-field.component";
export { IconButton, type IconButtonProps } from "./icon-button.component";
export { Input, type InputProps } from "./input.component";
export { Label, type LabelProps } from "./label.component";
export { Progress, type ProgressProps } from "./progress.component";
export { Radio, type RadioProps } from "./radio.component";
export { Select, type SelectProps } from "./select.component";
export { Spinner, type SpinnerProps } from "./spinner.component";
export { Switch, type SwitchProps } from "./switch.component";
export { Textarea, type TextareaProps } from "./textarea.component";
export { Tooltip, type TooltipProps } from "./tooltip.component";

// Composites — canonical
export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from "./breadcrumb.component";
export { PageHeader, type PageHeaderProps } from "./page-header.component";
export { SectionHeader, type SectionHeaderProps } from "./section-header.component";
export { EmptyState, type EmptyStateProps } from "./empty-state.component";
export { ErrorState, type ErrorStateProps } from "./error-state.component";
export { Skeleton, type SkeletonProps } from "./skeleton.component";
export { PageBanner, type PageBannerProps } from "./page-banner.component";
export {
  AppliedFilters,
  type AppliedFiltersProps,
  type AppliedFilter,
} from "./applied-filters.component";
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from "./segmented-control.component";
export { Pagination, type PaginationProps } from "./pagination.component";

export { Card, type CardProps } from "./card.component";
export { StatCard, type StatCardProps } from "./stat-card.component";
export { WidgetCard, type WidgetCardProps } from "./widget-card.component";
export { ProfileCard, type ProfileCardProps } from "./profile-card.component";
export { Timeline, type TimelineProps, type TimelineItem } from "./timeline.component";
export { CollapsiblePanel, type CollapsiblePanelProps } from "./collapsible-panel.component";

export { Modal, type ModalProps } from "./modal.component";
export { ConfirmModal, type ConfirmModalProps } from "./confirm-modal.component";
export {
  DeleteConfirmModal,
  type DeleteConfirmModalProps,
} from "./delete-confirm-modal.component";
export { Drawer } from "./drawer.component";
export { ActionPopover } from "./action-popover.component";
export { ActionMenu } from "./action-menu.component";
export { Tabs } from "./tabs.component";

export { Toaster, showToast } from "./toaster.component";

export {
  FormSection,
  FormTwoColumn,
  type FormSectionProps,
} from "./form-section.component";
export { FormFooter, type FormFooterProps } from "./form-footer.component";
export { Stepper, type StepperProps, type Step } from "./stepper.component";
export {
  FileUpload,
  type FileUploadProps,
  type FileUploadFile,
} from "./file-upload.component";

export {
  DataTable,
  type DataTableProps,
  type DataTableColumn,
  type DataTableSelection,
  type DataTableSort,
} from "./data-table.component";

export { UserMenu, type UserMenuProps, type UserMenuItem } from "./user-menu.component";
export { UserCard, type UserCardProps } from "./user-card.component";
export {
  CommandPalette,
  type CommandPaletteProps,
  type CommandItem,
} from "./command-palette.component";
export {
  SearchResultItem,
  type SearchResultItemProps,
} from "./search-result-item.component";

// Composites — discovered
export { PricingCard, type PricingCardProps } from "./pricing-card.component";
export {
  NotificationItem,
  type NotificationItemProps,
} from "./notification-item.component";
export { KanbanCard, KanbanColumn, type KanbanCardProps } from "./kanban-card.component";
