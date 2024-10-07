import numpy as np
from latex2sympy2 import latex2sympy
from manim import *

pi = PI
g = 9.81


def vector_at_point(point: np.ndarray, vector: np.ndarray) -> Arrow:
    out_point = np.add(point, vector)
    return Arrow(start=point, end=out_point, buff=0, stroke_width=1)


def unit_vector_at_point(point: np.ndarray, vector: np.ndarray) -> Arrow:
    mag = np.linalg.norm(vector)
    vector = 0.3 * (1 / mag) * vector
    out_point = np.add(point, vector)
    # const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    mapped_mag = (mag - 0) / (100 - 0) * (2 * PI - 0) + 0
    return Arrow(
        start=point,
        end=out_point,
        buff=0,
        color=ManimColor.from_hsv(np.array([mapped_mag, 1, 1])),
        stroke_width=1,
    )


def theta_double_dot(theta: float, theta_dot: float):
    L = 5
    mew = 1
    return (-g / L) * np.sin(theta) - mew * theta_dot


class MainScene(Scene):
    def construct(self):
        plane = NumberPlane(
            faded_line_ratio=5,
            x_range=(-3 * PI, 3 * PI, PI / 2),
            y_range=(-5, 5, 1),
            y_axis_config={"include_numbers": True, "font_size": 24},
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

        x_tex_lables = VGroup(
            *[
                (
                    MathTex(t, font_size=24).next_to(
                        plane.x_axis.n2p(x), 0.3 * DOWN + 0.3 * RIGHT
                    )
                )
                for t, x in zip(x_labels, np.arange(-5 * PI / 2, 5 * PI / 2, PI / 2))
                if t != "0"
            ]
        )

        self.play(Create(plane), Create(x_tex_lables))

        GAP = 0.5

        # x_axis_vectors = VGroup(
        #     *[
        #         unit_vector_at_point(
        #             plane.c2p(x, 0), np.array([0, theta_double_dot(x, 0), 0])
        #         )
        #         for x in np.arange(-5 * PI / 2, 5 * PI / 2, GAP)
        #     ]
        # )
        # y_axis_vectors = VGroup(
        #     *[
        #         unit_vector_at_point(
        #             plane.c2p(0, x), np.array([x, theta_double_dot(x, 0), 0])
        #         )
        #         for x in np.arange(-4, 4, GAP)
        #     ]
        # )
        # self.play(Create(x_axis_vectors), Create(y_axis_vectors))

        vectors = VGroup(
            *[
                VGroup(
                    *[
                        unit_vector_at_point(
                            plane.c2p(theta, theta_dot),
                            np.array(
                                [theta_dot, theta_double_dot(theta, theta_dot), 0]
                            ),
                        )
                        for theta in np.arange(-5 * PI / 2, 5 * PI / 2, GAP)
                    ]
                )
                for theta_dot in np.arange(-5, 5, GAP)
            ]
        )
        self.play(Create(vectors))

        self.wait(5)
