import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lessonsRouter from "./lessons";
import creatorsRouter from "./creators";
import auditRouter from "./audit";
import storyboardsRouter from "./storyboards";
import creditsRouter from "./credits";
import renderRouter from "./render";
import publishRouter from "./publish";
import invitesRouter from "./invites";
import agentRouter from "./agent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lessonsRouter);
router.use(creatorsRouter);
router.use(auditRouter);
router.use(storyboardsRouter);
router.use(creditsRouter);
router.use(renderRouter);
router.use(publishRouter);
router.use(invitesRouter);
router.use(agentRouter);

export default router;
