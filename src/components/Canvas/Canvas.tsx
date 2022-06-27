import { useCallback, useEffect, useRef, useState } from "react";
import { idText } from "typescript";

interface CanvasProps {
  width: number;
  height: number;
  img: HTMLImageElement | undefined;
  setData: (data: any) => void;
  collection: any;
  id: string;
}

interface Coordinate {
  x: number;
  y: number;
}

type Rectangle = [Coordinate, Coordinate];
type RectanglePoints = [Coordinate, Coordinate, Coordinate, Coordinate];

export const Canvas = ({ width, height, img, setData, collection, id }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [originalMousePosition, setOriginalMousePosition] = useState<
    Coordinate | undefined
  >(undefined);
  const [mousePosition, setMousePosition] = useState<Coordinate | undefined>(
    undefined
  );
  const [mouseOverPosition, setMouseOverPosition] = useState<Coordinate>();
  const [mouseOverRectangle, setMouseOverRectangle] = useState<number | undefined>();
  const [editMode, setEditMode] = useState(false);
  const [editRectangleIndex, setEditRectangleIndex] = useState<
    number | undefined
  >();
  const [editRectanglePoint, setEditRectanglePoint] = useState<
    number | undefined
  >();
  const [createMode, setCreateMode] = useState(false);
  
  console.log("Canvas", collection);

  useEffect(() => {
    console.log("Canvas", collection);
    setRectangles(collection.data || []);
  }, [id])

  useEffect(() => {
    console.log("setData", { imageUrl: id, data: rectangles });
    setData({ imageUrl: id, data: rectangles });
  }, [rectangles])


  const getCoordinates = (event: MouseEvent): Coordinate | undefined => {
    if (!canvasRef.current) {
      return;
    }

    const canvas: HTMLCanvasElement = canvasRef.current;
    return {
      x: event.pageX - canvas.offsetLeft,
      y: event.pageY - canvas.offsetTop,
    };
  };

  const checkCloseEnough = (p1: number, p2: number) => {
    const closeEnough = 10;
    return Math.abs(p1 - p2) < closeEnough;
  };

  const getRectanglePoints = (rectangle: Rectangle): RectanglePoints => {
    return [
      rectangle[0],
      { x: rectangle[1].x, y: rectangle[0].y },
      rectangle[1],
      { x: rectangle[0].x, y: rectangle[1].y },
    ];
  };

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return true;
  }, []);

  const startTransform = useCallback(
    (coordinates: Coordinate, editRectangleIndex: number) => {
      const rectangle = rectangles[editRectangleIndex];
      if (editRectanglePoint === undefined) return;
      if (editRectanglePoint === 0) {
        rectangle[editRectanglePoint] = coordinates;
      }
      if (editRectanglePoint === 1) {
        rectangle[1]["x"] = coordinates["x"];
        rectangle[0]["y"] = coordinates["y"];
      }
      if (editRectanglePoint === 2) {
        rectangle[1] = coordinates;
      }
      if (editRectanglePoint === 3) {
        rectangle[0]["x"] = coordinates["x"];
        rectangle[1]["y"] = coordinates["y"];
      }
      const newRectangles = [...rectangles];
      newRectangles[editRectangleIndex] = rectangle;
      setRectangles((prev) =>
        prev.map((rect, i) => (i === editRectangleIndex ? rectangle : rect))
      );
    },
    [editRectanglePoint, rectangles]
  );

  const startPaint = useCallback(
    (event: MouseEvent) => {
      const coordinates = getCoordinates(event);
      if (editRectangleIndex !== undefined) {
        setEditMode(true);
      }
      setCreateMode(true);

      if (coordinates && editRectangleIndex === undefined) {
        setMousePosition(coordinates);
        setOriginalMousePosition(coordinates);
        setIsPainting(true);
      }
    },
    [editRectangleIndex]
  );

  const drawBackground = useCallback(() => {
    if (!img) return;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
    }
  }, [img, width, height]);

  const drawRectangles = useCallback((rectangles: Rectangle[]) => {
    drawBackground();
    rectangles.forEach((rectangle: Rectangle) => {
      const [start, end] = rectangle;
      drawRectangle(start, end);
    });
  }, [drawBackground]);

  useEffect(() => {
    drawBackground()
  }, [drawBackground, img]);

  const checkNodeOfRectangle = useCallback(
    (rectangle: Rectangle, position: Coordinate, index: number) => {
      if (createMode) return;
      const points = getRectanglePoints(rectangle);
      const mouseOverPointIndex = points.findIndex((point) => {
        return (
          checkCloseEnough(point["x"], position.x) &&
          checkCloseEnough(point["y"], position.y)
        );
      });
      const point: Coordinate = points[mouseOverPointIndex];
      if (!point) return;
      setEditRectanglePoint(mouseOverPointIndex);
      return { point, mouseOverPointIndex };
    },
    [createMode]
  );

  const mouseOver = useCallback(
    (event: MouseEvent) => {
      const coordinates = getCoordinates(event);
      if (!coordinates) return;
      //check if mouse over rectangle
      rectangles.forEach((rectangle, index) => {
        const isX = coordinates["x"] > rectangle[0]["x"] && coordinates["x"] < rectangle[1]["y"]
        const isY = coordinates["y"] > rectangle[0]["y"] && coordinates["y"] < rectangle[1]["y"]
        if (isX && isY) {
          setMouseOverRectangle(index);
        } else {
          setMouseOverRectangle(undefined);
        }
      })
      if (coordinates) {
        setMouseOverPosition(coordinates);
        const points = rectangles.map((rectangle, index) => {
          const { point } =
            checkNodeOfRectangle(rectangle, coordinates, index) || {};
          return point;
        });
        const pointIndex = points.findIndex(Boolean);
        const point = points[pointIndex];
        if (point) {
          setIsPainting(false);
          setEditRectangleIndex(pointIndex);
          drawCircle(point);
        } else {
          if (createMode) return;
          clearCanvas();
          setEditRectangleIndex(undefined);
          setEditMode(false);
          drawRectangles(rectangles);
        }
      }
    },
    [checkNodeOfRectangle, clearCanvas, createMode, drawRectangles, rectangles]
  );

  const exitPaint = useCallback(() => {
    if (editMode) {
      setEditMode(false);
      if (editRectangleIndex && mousePosition) {
        startTransform(mousePosition, editRectangleIndex);
      }
    }
    setIsPainting(false);
    setOriginalMousePosition(undefined);
    setMousePosition(undefined);
    setCreateMode(false);
    
    if (originalMousePosition && mousePosition) {
      const width = Math.abs(mousePosition["x"] - originalMousePosition["x"]);
      const height = Math.abs(mousePosition["y"] - originalMousePosition["y"]);
      if (width < 30 || height < 30) return;
      setRectangles((prev) => [
        ...prev,
        [originalMousePosition, mousePosition],
      ]);
    }
  }, [
    editMode,
    editRectangleIndex,
    mousePosition,
    originalMousePosition,
    startTransform,
  ]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousemove", mouseOver);
    canvas.addEventListener("mouseup", exitPaint);
    canvas.addEventListener("mouseleave", exitPaint);
    return () => {
      canvas.removeEventListener("mousemove", mouseOver);
      canvas.removeEventListener("mouseup", exitPaint);
      canvas.removeEventListener("mouseleave", exitPaint);
    };
  }, [exitPaint, mouseOver]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousedown", startPaint);
    return () => {
      canvas.removeEventListener("mousedown", startPaint);
    };
  }, [startPaint]);

  const drawRectangle = (
    originalMousePosition: Coordinate,
    newMousePosition: Coordinate
  ) => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      context.strokeStyle = "rgba(37, 80, 0, 1)";
      context.lineJoin = "round";
      context.lineWidth = 1;
      context.beginPath();
      let rectWidth = newMousePosition.x - originalMousePosition.x;
      let rectHeight = newMousePosition.y - originalMousePosition.y;
      context.fillStyle = "rgba(225,225,225,0.5)";
      context.rect(
        originalMousePosition.x,
        originalMousePosition.y,
        rectWidth,
        rectHeight
      );
      context.fillStyle = "rgba(227, 237, 112, 0.6)";
      context.fillRect(
        originalMousePosition.x,
        originalMousePosition.y,
        rectWidth,
        rectHeight
      );
      context.stroke();
    }
  };

  const drawCircle = (coordinate: Coordinate) => {
    const { x, y } = coordinate;
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      context.strokeStyle = "red";
      context.lineJoin = "round";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fillStyle = "rgba(225,225,225,0.5)";
      context.fill();
      context.stroke();
    }
  };

  const paint = useCallback(
    (event: MouseEvent) => {
      const newMousePosition = getCoordinates(event);
      if (editMode) {
        if (!canvasRef.current) {
          return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (
          newMousePosition !== undefined &&
          editRectangleIndex !== undefined
        ) {
          startTransform(newMousePosition, editRectangleIndex);
        }
        drawRectangles(rectangles);
        return;
      }
      if (isPainting) {
        if (!canvasRef.current) {
          return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
        drawRectangles(rectangles);
        if (originalMousePosition && newMousePosition) {
          drawRectangle(originalMousePosition, newMousePosition);
          setMousePosition(newMousePosition);
        }
      }
    },
    [
      drawRectangles,
      editMode,
      editRectangleIndex,
      isPainting,
      originalMousePosition,
      rectangles,
      startTransform,
    ]
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousemove", paint);
    return () => {
      canvas.removeEventListener("mousemove", paint);
    };
  }, [paint]);

  return (
    <div>
      <div style={{ position: "absolute" }}>
        <div>Edit mode:{JSON.stringify(editMode)}</div>
        <div>editRectangleIndex:{JSON.stringify(editRectangleIndex)}</div>
        <div>editRectanglePoint:{JSON.stringify(editRectanglePoint)}</div>
        <div>editRectanglePoint:{JSON.stringify(mouseOverRectangle)}</div>
        <div>{JSON.stringify(mousePosition)}</div>
        <div>{JSON.stringify(originalMousePosition)}</div>
        <div>{rectangles.length}</div>
        <div>{JSON.stringify(rectangles)}</div>
        <div>MouseOver{JSON.stringify(mouseOverPosition)}</div>
        <div>{isPainting ? "isPainting" : "Not painting"}</div>
      </div>
      <canvas ref={canvasRef} height={height} width={width} />
    </div>
  );
};

Canvas.defaultProps = {
  width: window.innerWidth,
  height: window.innerHeight,
};
