/**
 * core/design-system — the public UI contract.
 *
 * App code and other modules import UI from HERE, never from `@/components/ui/*`
 * directly (those are vendored shadcn primitives, treated like dependencies).
 * See docs/DESIGN_SYSTEM.md. Boundary is convention in v1 (ARCHITECTURE §4.4);
 * lint enforcement is added in WP-03.
 */

// primitives (shadcn / radix)
export { Button, buttonVariants } from "@/components/ui/button";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { Label } from "@/components/ui/label";
export { Checkbox } from "@/components/ui/checkbox";
export { Badge, badgeVariants } from "@/components/ui/badge";
export { Separator } from "@/components/ui/separator";
export { Skeleton } from "@/components/ui/skeleton";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
export { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
export { toast } from "sonner";

// composed — Calm Wellness
export { cn } from "@/lib/utils";
export { Icon, type IconName } from "./icon";
export { Logo } from "./logo";
export { TherapistShell, type NavItem, type NavGroup } from "./shells/therapist-shell";
export { PatientShell, type PatientNavItem } from "./shells/patient-shell";
export { EmptyState } from "./states/empty-state";
export { ErrorState } from "./states/error-state";
export { LoadingRows, LoadingCards } from "./states/loading-state";
