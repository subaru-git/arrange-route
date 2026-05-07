import { NewPostForm } from "@/components/new-post-form";

export default function NewPage() {
  return (
    <section className="new-post-page">
      <header>
        <p>Arrange Wiki</p>
        <h1>New route</h1>
      </header>
      <NewPostForm />
    </section>
  );
}
