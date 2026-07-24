import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lessonsRouter from "./lessons";
import creatorsRouter from "./creators";
import auditRouter from "./audit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lessonsRouter);
router.use(creatorsRouter);
router.use(auditRouter);

export default router;
