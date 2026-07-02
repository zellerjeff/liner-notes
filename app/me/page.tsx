import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { listItems } from "@/lib/db";
import Editor from "@/components/Editor";

export const metadata = { title: "My page — Liner Notes" };

export default async function MePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <Editor
      initialUser={{
        name: user.name,
        image: user.image,
        slug: user.slug,
        page_title: user.page_title,
        intro: user.intro,
        is_public: user.is_public === 1,
      }}
      initialItems={await listItems(user.id)}
    />
  );
}
