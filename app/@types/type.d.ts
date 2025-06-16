export interface MynaIconsProps extends Omit<LucideProps, "ref"> {
  className?: string;
  stroke?: string; // pastikan hanya string, bukan string | number
}

export interface ActionErrorData  {
  error: {
    username?: string[];
    name?: string[];
    password?: string[];
    password_confirmation?: string[];
  };
};