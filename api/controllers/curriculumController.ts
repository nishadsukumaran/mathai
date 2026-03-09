/**
 * @module api/controllers/curriculumController
 *
 * GET /api/curriculum          — full curriculum tree for a student
 * GET /api/topic/:topicId      — single topic with progress
 * GET /api/weak-areas/:studentId — weak area recommendations
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  StudentIdParamSchema,
  TopicIdParamSchema,
  CurriculumQuerySchema,
} from "../validators/shared.validators";
import {
  getCurriculumTree,
  getTopicDetail,
  getWeakAreas,
} from "../services/curriculumService";
import { send } from "../lib/response";

/** GET /api/curriculum */
export async function getCurriculum(req: Request, res: Response, next: NextFunction) {
  try {
    const query   = CurriculumQuerySchema.parse(req.query);
    const userId  = req.student?.id ?? "";          // from auth middleware

    const tree = await getCurriculumTree({
      userId,
      grade:  query.grade as any,
      strand: query.strand as any,
    });

    send(res, tree, { count: tree.length });
  } catch (err) {
    next(err);
  }
}

/** GET /api/topic/:topicId */
export async function getTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { topicId } = TopicIdParamSchema.parse(req.params);
    const userId      = req.student?.id;

    const topic = await getTopicDetail(topicId, userId);
    send(res, topic);
  } catch (err) {
    next(err);
  }
}

/** GET /api/weak-areas/:studentId */
export async function getWeakAreasForStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = StudentIdParamSchema.parse(req.params);
    const areas = await getWeakAreas(studentId);
    send(res, areas, { count: areas.length });
  } catch (err) {
    next(err);
  }
}
