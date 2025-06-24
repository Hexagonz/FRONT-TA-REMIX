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

interface kelas {
  nama_kelas: string;
  nama_romawi: string;
}

interface Jurusan {
  nama_jurusan: string;
  nama_deskripsi: string;
}

interface Siswa {
  nama_siswa: string;
  nisn: string;
  no_absen: number;
  id_kelas: number;
  id_jurusan: number;
}
export type LoaderKelasJurusan = {
  status: true;
  message: string;
  data: {
    kelas: Kelas[];
    jurusan: Jurusan[];
    siswa?: Siswa
  };
};

