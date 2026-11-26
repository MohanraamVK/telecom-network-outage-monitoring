import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/Feedback";
import Button from "../components/ui/Button";

function NotFoundPage() {
  return (
    <EmptyState
      title="This page doesn't exist"
      action={
        <Link to="/">
          <Button variant="primary">Go to overview</Button>
        </Link>
      }
    >
      The link may be old, or the address has a typo.
    </EmptyState>
  );
}

export default NotFoundPage;
