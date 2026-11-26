import { Spinner } from "../ui/Feedback";

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-7" />
    </div>
  );
}

export default PageLoader;
