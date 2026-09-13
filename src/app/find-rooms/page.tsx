import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FindRoomsClient } from "@/components/find-rooms-client";

export default function FindRoomsPage() {
  return (
    <>
      <SiteHeader />
      <FindRoomsClient />
      <SiteFooter />
    </>
  );
}
