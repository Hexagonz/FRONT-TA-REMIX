export interface MynaIconsProps extends Omit<LucideProps, "ref"> {
  className?: string;
  stroke?: string; // pastikan hanya string, bukan string | number
}

export interface ActionErrorData {
  error: {
    username?: string[];
    name?: string[];
    password?: string[];
    password_confirmation?: string[];
  };
}

interface Guru {
  nama_guru: string;
  nip: string;
  id_mapel: number;
}

export type LoaderSuccess = {
  status: true;
  message: string;
  data: {
    list: Guru[];
    detail: Guru;
  };
};

