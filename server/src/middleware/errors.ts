export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function notFound(req: any, res: any) {
  res.status(404).json({ error: { message: "Route not found" } });
}
export function errorHandler(error: any, req: any, res: any, next: any) {
  void next;
  console.error(error.message);
  res
    .status(error.status || 500)
    .json({
      error: {
        message: error.status ? error.message : "Internal server error",
      },
    });
}
