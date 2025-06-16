export default function Navbar({ title }: { title: string }) {
  return (
    <>
      <div className="w-[97%] h-10 bg-white my-2 rounded-[10px] shadow-md inline-flex"></div>
      <h1 className="font-bold text-[#5D5D5D]">{title}</h1>
    </>
  );
}
