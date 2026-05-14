export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container-lg py-6 text-sm text-gray-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Peak</span>
        <span className="hidden sm:inline">Equipment rental marketplace</span>
      </div>
    </footer>
  );
}
