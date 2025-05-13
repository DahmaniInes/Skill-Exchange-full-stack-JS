import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import RoadmapService from "../../services/RoadmapService";
import { toast } from "react-toastify";
import "./create-roadmap.css";

function CreateRoadmapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const skillId = searchParams.get("skillId");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    goals: ["Master the basics"],
    timeframe: 6,
    preferences: {
      learningStyle: "Self-paced",
      availability: 10,
      userId: localStorage.getItem("userId") // Assuming userId is stored in localStorage
    },
    categories: [
      {
        name: "Technical Skills",
        skills: [""],
        dependencies: [[]], // Dependencies for each skill
        notes: [""] // Notes for each skill
      },
      {
        name: "Soft Skills",
        skills: [""],
        dependencies: [[]],
        notes: [""]
      },
      {
        name: "Product and Service Training",
        skills: [""],
        dependencies: [[]],
        notes: [""]
      }
    ]
  });

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.warning("Please log in to create a roadmap");
      navigate("/login", { state: { returnUrl: window.location.pathname + window.location.search } });
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "timeframe") {
      setFormData({ ...formData, timeframe: parseInt(value) || 1 });
    } else if (name === "availability") {
      setFormData({
        ...formData,
        preferences: { ...formData.preferences, availability: parseInt(value) || 5 }
      });
    } else if (name === "goals") {
      const goalsArray = value.split(",").map(goal => goal.trim()).filter(goal => goal.length > 0);
      setFormData({ ...formData, goals: goalsArray.length > 0 ? goalsArray : ["Master the basics"] });
    } else if (name === "learningStyle") {
      setFormData({
        ...formData,
        preferences: { ...formData.preferences, learningStyle: value }
      });
    }
  };

  const handleAddSkill = (categoryIndex) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].skills.push("");
    updatedCategories[categoryIndex].dependencies.push([]);
    updatedCategories[categoryIndex].notes.push("");
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const handleRemoveSkill = (categoryIndex, skillIndex) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].skills.splice(skillIndex, 1);
    updatedCategories[categoryIndex].dependencies.splice(skillIndex, 1);
    updatedCategories[categoryIndex].notes.splice(skillIndex, 1);
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const handleSkillChange = (categoryIndex, skillIndex, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].skills[skillIndex] = value;
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const handleNoteChange = (categoryIndex, skillIndex, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].notes[skillIndex] = value;
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const handleDependencyChange = (categoryIndex, skillIndex, dependencyIndex, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].dependencies[skillIndex][dependencyIndex] = value;
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const handleAddCategory = () => {
    setFormData({
      ...formData,
      categories: [
        ...formData.categories,
        {
          name: "New Category",
          skills: [""],
          dependencies: [[]],
          notes: [""]
        }
      ]
    });
  };

  const handleCategoryNameChange = (index, value) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index].name = value;
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const handleRemoveCategory = (index) => {
    if (formData.categories.length <= 1) {
      toast.warning("You need at least one category");
      return;
    }

    const updatedCategories = [...formData.categories];
    updatedCategories.splice(index, 1);
    setFormData({
      ...formData,
      categories: updatedCategories
    });
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!skillId) {
        toast.error("Skill ID is required");
        return false;
      }
      if (formData.goals.length === 0) {
        toast.error("At least one goal is required");
        return false;
      }
      return true;
    } else if (currentStep === 2) {
      for (const category of formData.categories) {
        if (category.skills.some(skill => !skill.trim())) {
          toast.error("Please fill in all skills or remove empty ones");
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreateRoadmap = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      if (!skillId) {
        throw new Error("Skill ID is required");
      }

      const categorizedSkills = {};
      formData.categories.forEach(category => {
        category.skills.forEach((skill, index) => {
          if (skill.trim()) {
            if (!categorizedSkills[category.name]) {
              categorizedSkills[category.name] = [];
            }
            categorizedSkills[category.name].push({
              skill,
              notes: category.notes[index],
              dependencies: category.dependencies[index]
            });
          }
        });
      });

      const apiFormData = {
        goals: formData.goals,
        timeframe: formData.timeframe,
        preferences: formData.preferences,
        categorizedSkills
      };

      const response = await RoadmapService.createRoadmap(
        skillId,
        apiFormData.goals,
        apiFormData.timeframe,
        apiFormData.preferences,
        apiFormData.categorizedSkills
      );

      if (response.success && response.roadmap?._id) {
        toast.success("Roadmap created successfully!");
        navigate(`/roadmap/${response.roadmap._id}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      toast.error(error.message);
      if (error.message.includes("Skill not found")) {
        navigate("/skills");
      }
    } finally {
      setLoading(false);
    }
  };

  const getMonthLabels = () => {
    const months = [];
    for (let i = 1; i <= formData.timeframe; i++) {
      months.push(`Month ${i}`);
    }
    return months;
  };

  const renderStepOne = () => {
    return (
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goals (comma separated)</label>
          <input
            type="text"
            name="goals"
            className="w-full p-2 border rounded-md"
            placeholder="Master basics, Build a project"
            value={formData.goals.join(", ")}
            onChange={handleInputChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            What do you want to achieve with this roadmap?
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe (months)</label>
          <input
            type="number"
            name="timeframe"
            className="w-full p-2 border rounded-md"
            min="1"
            max="12"
            value={formData.timeframe}
            onChange={handleInputChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            How many months do you want this roadmap to span?
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Learning Style</label>
          <select
            name="learningStyle"
            className="w-full p-2 border rounded-md"
            value={formData.preferences.learningStyle}
            onChange={handleInputChange}
          >
            <option value="Self-paced">Self-paced</option>
            <option value="Structured">Structured</option>
            <option value="Project-based">Project-based</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Available Hours per Week</label>
          <input
            type="number"
            name="availability"
            className="w-full p-2 border rounded-md"
            min="1"
            max="40"
            value={formData.preferences.availability}
            onChange={handleInputChange}
          />
        </div>
      </div>
    );
  };

  const renderStepTwo = () => {
    return (
      <div className="space-y-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Define Skills by Category</h2>
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
          >
            Add Category
          </button>
        </div>

        {formData.categories.map((category, catIndex) => (
          <div key={catIndex} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <input
                type="text"
                value={category.name}
                onChange={(e) => handleCategoryNameChange(catIndex, e.target.value)}
                className="font-medium p-1 border-b border-dashed focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveCategory(catIndex)}
                className="text-red-500 hover:text-red-700"
                disabled={formData.categories.length <= 1}
              >
                Remove
              </button>
            </div>

            <div className="space-y-2">
              {category.skills.map((skill, skillIndex) => (
                <div key={skillIndex} className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(catIndex, skillIndex, e.target.value)}
                      className="flex-grow p-2 border rounded-md"
                      placeholder="Enter a skill (e.g., 'Communication Skills')"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(catIndex, skillIndex)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      disabled={category.skills.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={category.notes[skillIndex]}
                      onChange={(e) => handleNoteChange(catIndex, skillIndex, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Add notes for this skill..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dependencies</label>
                    <input
                      type="text"
                      value={category.dependencies[skillIndex].join(", ")}
                      onChange={(e) => handleDependencyChange(catIndex, skillIndex, 0, e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter dependencies (comma-separated step titles)"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddSkill(catIndex)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Skill
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStepThree = () => {
    const months = getMonthLabels();

    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Preview Your Roadmap Timeline</h2>

        <div className="border rounded-lg overflow-hidden">
          <div className="flex border-b bg-gray-50">
            <div className="w-48 p-3 font-bold">Skill Categories</div>
            {months.map((month, idx) => (
              <div key={idx} className="flex-1 p-3 text-center font-bold border-l">
                {month}
              </div>
            ))}
          </div>

          {formData.categories.map((category, catIndex) => (
            <div key={catIndex} className="border-b">
              <div className="p-3 bg-gray-50 font-medium">{category.name}</div>

              {category.skills.map((skill, skillIdx) => {
                if (!skill.trim()) return null;

                const startMonth = Math.min(
                  Math.floor((skillIdx / category.skills.length) * formData.timeframe),
                  formData.timeframe - 1
                );
                const duration = Math.max(
                  1,
                  Math.min(
                    Math.ceil(formData.timeframe / category.skills.length),
                    formData.timeframe - startMonth
                  )
                );

                return (
                  <div key={skillIdx} className="flex border-t">
                    <div className="w-48 p-3 text-sm">{skill}</div>

                    {months.map((_, monthIdx) => {
                      const isActive = monthIdx >= startMonth && monthIdx < startMonth + duration;
                      const isStart = monthIdx === startMonth;
                      const isEnd = monthIdx === startMonth + duration - 1;

                      let bgColorClass = "";
                      if (isActive) {
                        if (catIndex === 0) bgColorClass = "bg-blue-100";
                        else if (catIndex === 1) bgColorClass = "bg-green-100";
                        else if (catIndex === 2) bgColorClass = "bg-purple-100";
                        else bgColorClass = "bg-gray-100";
                      }

                      const borderLeftRadius = isStart ? "rounded-l-full" : "";
                      const borderRightRadius = isEnd ? "rounded-r-full" : "";

                      return (
                        <div key={monthIdx} className="flex-1 p-3 border-l relative">
                          {isActive && (
                            <div
                              className={`absolute top-3 bottom-3 left-0 right-0 ${bgColorClass} ${borderLeftRadius} ${borderRightRadius} mx-1 opacity-80`}
                            ></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-4">
          This is a preview of how your roadmap might look. The actual timeline will be optimized when the roadmap is created.
        </p>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Your Development Roadmap</h1>

      <div className="mb-8">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Step {currentStep} of 3</span>
          <span className="text-sm font-medium">{Math.round((currentStep / 3) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        {currentStep === 1 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            {renderStepOne()}
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Skills and Categories</h2>
            {renderStepTwo()}
          </>
        )}

        {currentStep === 3 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Preview and Create</h2>
            {renderStepThree()}
          </>
        )}

        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              className={`px-4 py-2 rounded-md ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              onClick={handleCreateRoadmap}
              disabled={loading}
            >
              {loading ? "Creating Roadmap..." : "Create Roadmap"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateRoadmapPage;