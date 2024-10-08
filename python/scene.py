import numpy as np
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


def theta_double_dot(theta: float, theta_dot: float) -> float:
    L = 5
    mew = 1
    return (-g / L) * np.sin(theta) - mew * theta_dot


def s_double_dot(s: float, v: float) -> float:
    mew = 1
    return -g - mew * v


def x_double_dot_van_der_pol(x: float, x_dot: float) -> float:
    mew = 1
    return mew * (1 - x**2) * x_dot - x


def state_velocity_vector(point: np.ndarray, de) -> np.ndarray:
    return np.array([point[1], de(point[0], point[1]), 0])


def simulate_system_evolution(start_point: np.ndarray, dt: float, de) -> VGroup:
    points = [start_point]
    mobjects: list[Dot | Line] = [Dot(point=start_point, radius=0.03)]

    while True:
        last_point = points[-1]

        next_point = last_point + dt * state_velocity_vector(last_point, de)

        if len(points) >= 2500:
            break

        points.append(next_point)

        mobjects.append(
            Dot(point=next_point, radius=0.03),
        )
        mobjects.append(
            Line(start=last_point, end=next_point, stroke_width=0.5),
        )

    return VGroup(*mobjects)


class MainScene(Scene):
    def construct(self):
        current_de = theta_double_dot
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

        vectors = VGroup(
            *[
                VGroup(
                    *[
                        unit_vector_at_point(
                            plane.c2p(theta, theta_dot),
                            state_velocity_vector(
                                np.array([theta, theta_dot, 0]), current_de
                            ),
                        )
                        for theta in np.arange(-5 * PI / 2, 5 * PI / 2, GAP)
                    ]
                )
                for theta_dot in np.arange(-5, 5, GAP)
            ]
        )
        self.play(Create(vectors))

        self.wait(2.5)

        dt = 0.01

        simulation = simulate_system_evolution(
            np.array([PI - 0.1, 0.5, 0]), dt, current_de
        )
        self.play(Create(simulation))

        self.wait(5)
