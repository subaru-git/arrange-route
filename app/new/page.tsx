import { NewPostForm } from "@/components/new-post-form";

export default function NewPage() {
  return (
    <section>
      <h1>New Arrange Post</h1>
      <p>Build routes by button input. The first route you enter is shown on the top row.</p>
      <NewPostForm />
    </section>
  );
}
