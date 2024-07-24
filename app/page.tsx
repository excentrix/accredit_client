import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { cookies } from "next/headers";
import { Mail } from "@/components/mail";

import { accounts, mails } from "@/components/data";

export default function Home() {
  const layout = cookies().get("react-resizable-panels:layout:mail");
  const collapsed = cookies().get("react-resizable-panels:collapsed");

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;
  return (
    <main className="flex min-h-screen w-full">
      <SignedIn>
        <UserButton />
      </SignedIn>
      <>
        <div className="md:hidden">
          <Image
            src="/examples/mail-dark.png"
            width={1280}
            height={727}
            alt="Mail"
            className="hidden dark:block"
          />
          <Image
            src="/examples/mail-light.png"
            width={1280}
            height={727}
            alt="Mail"
            className="block dark:hidden"
          />
        </div>
        <div className="hidden flex-col md:flex w-full">
          <Mail
            accounts={accounts}
            defaultLayout={defaultLayout}
            defaultCollapsed={defaultCollapsed}
            navCollapsedSize={4}
          />
        </div>
      </>
    </main>
  );
}
