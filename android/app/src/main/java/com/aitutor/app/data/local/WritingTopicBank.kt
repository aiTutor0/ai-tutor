package com.aitutor.app.data.local

import com.aitutor.app.domain.model.WritingTaskType
import com.aitutor.app.domain.model.WritingTopic

/**
 * Static topic bank used as a fallback / starter set.
 * The AI generator is preferred at runtime — this just keeps the module
 * functional even when network / OpenAI is unavailable.
 *
 * Topics for IELTS Task 2 are mirrored from
 * `_reference/js/services/writingService.js`.
 */
object WritingTopicBank {

    private val IELTS_TASK_2 = listOf(
        "Some people believe that technology has made our lives too complex, and the solution is to lead a simpler life without technology. To what extent do you agree or disagree?",
        "In many countries, the gap between the rich and the poor is increasing. What problems does this cause? What solutions can you suggest?",
        "Some people think that the government should provide free university education. Others believe students should pay for their own education. Discuss both views and give your opinion.",
        "Climate change is a major global challenge. Should individuals or governments take more responsibility for addressing this issue?",
        "Many people believe that social media has a negative impact on individuals and society. To what extent do you agree or disagree?",
        "Some argue that competitive sports teach children important life skills. Others believe it puts unnecessary pressure on young people. Discuss both views.",
        "In some countries, young people are encouraged to work or travel for a year between finishing high school and starting university. Discuss the advantages and disadvantages.",
        "The rise of artificial intelligence will cause more problems than it solves. To what extent do you agree or disagree?",
        "Some people think that parents should teach children how to be good members of society. Others believe school is the best place for this. Discuss both views.",
        "Many cities are now banning cars from their centers. What are the advantages and disadvantages of this policy?"
    )

    private val IELTS_TASK_1_CHARTS = listOf(
        "The chart shows internet usage by age group from 2020 to 2023." to
            "Bar chart with categories: under 25, 25-44, 45-64, 65+. Values rise across all groups, sharpest in 65+.",
        "The graph shows global CO2 emissions by major country between 2010 and 2023." to
            "Line chart: China rises sharply, US declines, India rises moderately, EU declines.",
        "The pie chart shows university enrollment by subject area in 2024." to
            "STEM 40%, Humanities 22%, Business 20%, Arts 10%, Other 8%.",
        "The table compares mobile phone sales by brand from 2020-2023." to
            "Brand A grows fastest; Brand B steady; Brand C declines."
    )

    private val TOEFL_INDEPENDENT = listOf(
        "Do you agree or disagree with the following statement? Universities should require all students to take basic courses in art and music.",
        "Some people prefer to live in a small town. Others prefer to live in a big city. Which do you prefer? Use specific reasons and details.",
        "Do you agree or disagree: Modern technology is creating a single global culture. Use specific examples.",
        "Some people believe that students should be allowed to use cell phones in classrooms. Others disagree. Which view do you support?",
        "Do you agree or disagree: Children should begin learning a foreign language as soon as they start school?"
    )

    private val TOEFL_INTEGRATED = listOf(
        "A reading passage argues that nuclear energy is essential for combating climate change. A lecturer presents three counter-arguments about safety, waste, and cost. Summarize the lecturer's points and explain how they cast doubt on the reading.",
        "A passage describes the benefits of remote work. A lecture challenges these benefits with examples about productivity, collaboration, and isolation. Summarize the lecturer's main objections.",
        "A reading recommends standardized testing for university admission. The lecturer disagrees and offers alternative assessment methods. Summarize and explain how they refute the reading."
    )

    fun random(taskType: WritingTaskType): WritingTopic {
        return when (taskType) {
            WritingTaskType.IELTS_TASK_2 ->
                WritingTopic(taskType.name, IELTS_TASK_2.random())
            WritingTaskType.IELTS_TASK_1 -> {
                val (prompt, source) = IELTS_TASK_1_CHARTS.random()
                WritingTopic(taskType.name, "Describe the chart below in at least 150 words.", source)
            }
            WritingTaskType.TOEFL_INDEPENDENT ->
                WritingTopic(taskType.name, TOEFL_INDEPENDENT.random())
            WritingTaskType.TOEFL_INTEGRATED -> {
                val prompt = TOEFL_INTEGRATED.random()
                WritingTopic(taskType.name, "Read + Listen + Write task.", prompt)
            }
        }
    }
}
