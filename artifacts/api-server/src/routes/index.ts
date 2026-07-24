import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lessonsRouter from "./lessons";
import creatorsRouter from "./creators";
import auditRouter from "./audit";
import storyboardsRouter from "./storyboards";
import creditsRouter from "./credits";
import renderRouter from "./render";
import publishRouter from "./publish";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lessonsRouter);
router.use(creatorsRouter);
router.use(auditRouter);
router.use(storyboardsRouter);
router.use(creditsRouter);
router.use(renderRouter);
router.use(publishRouter);

export default router;
