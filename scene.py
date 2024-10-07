import numpy as np
from latex2sympy2 import latex2sympy
from manim import *

pi = PI


def vector_at_point(point: np.ndarray, vector: np.ndarray) -> Arrow:
    out_point = np.add(point, vector)
    return Arrow(start=point, end=out_point, buff=0)


class MainScene(Scene):
    def construct(self):
        plane = NumberPlane(
            faded_line_ratio=6,
            x_range=(-3 * PI, 3 * PI, PI / 2),
            # y_axis_config={"include_numbers": False},
        )
        x_labels = [
            "\\frac{-5\\pi}{2}",
            "-\\tau",
            "\\frac{-3\\pi}{2}",
            "-\\pi",
            "\\frac{-\\pi}{2}",
            "0",
            "\\frac{\\pi}{2}",
            "\\pi",
            "\\frac{3\\pi}{2}",
            "\\tau",
            "\\frac{5\\pi}{2}",
        ]
        # axes = Axes(
        #     x_range=(-2 * PI, 2 * PI, PI / 2),
        #     x_length=config.frame_width,
        #     y_length=config.frame_height,
        #     axis_config={"include_tip": False},
        #     y_axis_config={"scaling": LinearBase(scale_factor=0.5)},
        # )
        # axes.center()
        thing = [
            (
                MathTex(t, font_size=24).next_to(
                    plane.x_axis.n2p(x), 0.2 * DOWN + 0.25 * RIGHT
                )
                # .shift(plane.c2p(x, 0))
            )
            for t, x in zip(x_labels, np.arange(-5 * PI / 2, 5 * PI / 2, PI / 2))
            if t != "0"
        ]

        x_tex_lables = VGroup(*thing)

        self.play(Create(plane), Create(x_tex_lables))

        # axes = Axes(
        #     x_range=(-10, 10, 1),
        #     y_range=(-5, 5, 1),
        #     axis_config={"include_numbers": True},
        # )
        # self.play(Create(axes))

        # plane = NumberPlane(
        #     x_range=[-3 * PI, 3 * PI, PI / 2], y_range=[-1, 7, 1], faded_line_ratio=6
        # )
        # self.play(Create(plane))

        self.wait(5)
