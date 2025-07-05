import { Eye } from "@mynaui/icons-react";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export default function Index() {
  return (
    <div className="bg-white shadow-md rounded-lg my-5 w-11/12">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Tanggal</TableHead>
            <TableHead className="text-center">Jam</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead >Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium text-center text-xs">Senin,<br/> 12 Jan 1945</TableCell>
            <TableCell className="text-center">08:00</TableCell>
            <TableCell className="text-center">Sudah Absen</TableCell>
            <TableCell>
              <Button
                asChild
                className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white"
              >
                <Link to={`/data-ruangan/view/`}>
                  <Eye className="text-[#4F6FFF] " />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-center text-xs">Senin,<br/> 12 Jan 1945</TableCell>
            <TableCell className="text-center">08:00</TableCell>
            <TableCell className="text-center">Sudah Absen</TableCell>
            <TableCell>
              <Button
                asChild
                className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white"
              >
                <Link to={`/data-ruangan/view/`}>
                  <Eye className="text-[#4F6FFF] " />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-center text-xs">Senin,<br/> 12 Jan 1945</TableCell>
            <TableCell className="text-center">08:00</TableCell>
            <TableCell className="text-center">Sudah Absen</TableCell>
            <TableCell>
              <Button
                asChild
                className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white"
              >
                <Link to={`/data-ruangan/view/`}>
                  <Eye className="text-[#4F6FFF] " />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
