import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { FC } from "react";
import type { LucideProps } from "lucide-react";
import { MynaIconsProps } from "~/@types/type";

export default function AlertComponent({
  className,
  text,
  Icon,
  classIcon,
  alertTitle,
  alertDesc,
  onClick,
  color,
}: {
  className: string;
  text?: string;
  Icon: FC<MynaIconsProps>;
  classIcon: string;
  alertTitle: string;
  alertDesc?: string;
  onClick?: (data?: string) => void | Promise<void>;
  color: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Icon className={classIcon} />
          {text}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#5D5D5D] text-sm">
            {alertTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>{alertDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={`text-[${color}] hover:text-[${color}] hover:bg-slate-200`}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onClick?.()}
            className={`text-white hover:bg-slate-300`}
            style={{ backgroundColor: color }}
          >
            Ok
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
