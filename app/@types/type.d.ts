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
    ruang: RuangKelas[];
    siswa?: Siswa;
    foto: Foto;
  };
};

export interface Siswa {
  data: {
    id_siswa: number;
    nama_siswa: string;
    nisn: string;
    no_absen: number;
    id_kelas: number;
    id_jurusan: number;
    id_ruang: number;
  };
}

interface Foto {
  data: {
    images: string[]
  }
}
export interface Guru {
  id_guru: number;
  nama_guru: number;
  id_mapel: number;
}

export interface RuangKelas {
  id_ruang: number;
  nomor_ruang: number;
  id_jurusan: number;
}

export interface Jurusan {
  id_jurusan: number;
  nama_jurusan: string;
  deskripsi: string;
}

export interface Kelas {
  id_kelas: number;
  nama_kelas: string;
  kelas_romawi: string;
}

export interface RuangKelas {
  id_ruang: number;
  nomor_ruang: number;
  id_jurusan: number;
  jurusan: Jurusan;
}