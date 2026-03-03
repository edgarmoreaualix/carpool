import { router } from "./trpc";
import { matchingRouter } from "./routers/matching";
import { scheduleRouter } from "./routers/schedule";
import { userRouter } from "./routers/user";

export const appRouter = router({
  user: userRouter,
  schedule: scheduleRouter,
  matching: matchingRouter,
});

export type AppRouter = typeof appRouter;
