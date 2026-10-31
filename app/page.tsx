import { HambaziApp } from "@/application/HambaziApp";
import { AppStore } from "@/lib/app-store";

export default function Page() {
  return (
    <AppStore>
      <HambaziApp />
    </AppStore>
  );
}
